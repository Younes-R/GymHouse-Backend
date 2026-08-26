# GymHouse Backend

## Docker Setup

1. Copy [.env.docker.example](.env.docker.example) to `.env.docker` and fill real values.
2. Start Postgres:

```powershell
docker compose up -d db
```

3. Apply Prisma migrations:

```powershell
docker compose --profile migrate up --build migrate
```

4. Start the API:

```powershell
docker compose up --build -d app
```

5. Check logs:

```powershell
docker compose logs -f app
```

6. Stop everything:

```powershell
docker compose down
```

##

Notes:

- API is exposed on `http://localhost:3000`.
- Postgres data is persisted in Docker volume `db_data`.
- Run migrations again whenever you add a new Prisma migration.

Hello! If you are reading this, well.. it's a bit messy . most of my writings down are to clear ideas during development

## Notes

- on database service, search more about `OnModuleInit` interface. we tried to remove the connection string, and things worked fine

## Subscription Flow

- [x] user chooses a plan and a start date (pays online always). request is sent
- [x] check if plan exists. if no, send 400
- [x] check if there are subs overlapping this new one, with a PAID status. if yes, send 400
- [x] create the sub record
- [x] create the payment record
- [x] redirect to chargilyPay
- [x] webhook updates payment status

at the webhook:

- [x] validate the request. if false, send 40X
- [x] check if there are subs overlapping this one with a PAID status. if no, proceed to update. if yes, flag this one as a REFUND_REQUIRED

## UseCase: client access/exit gym via account ID (if paid) Flow

- client reaches gym door, scans a QR code (or alternatively: clicks a 'Open Door' button which triggers a request to the API. I was thinking in making the QR code the requested URL, so those two methods are basically the same)
- request sent to `POST /gym/door`
- backend verifies:
  - if the client has a valid subscription that day,
  - if he did not attend before that day,
  - and if his gender is the same as the one mentioned in the sessions schedule

  if yes: send a response to open the door; a response with ACTION='OPEN_DOOR' or ACCESS='ALLOWED' to the door, and a confirmation msg (or 200 OK) to the user mobile, and register the attendance

  if no: send a response to user to inform him that access is denied

## Payment Cron Job

**objectif**: detect payments for overlapping subs of the same user

## Payment Background Job

**objectif**: get checkout/payment updates from ChargilyPay if the webhook failed

after exploring different methods to implement this, we settled to use pgmq instead of bullmq, due to our requirements being simple and not too complex, that using bullmq would be an overkill for the problem, in addition to infra and maintenance overhead (we will need to set up redis to use bullmq).

to implment pgmq, we searched for helping libraries, and found one (Elter71/nestjs-pgmq)! But after reading the docs, we found out the lib is quite powerful, and made for much complex problems (dealing with distributed systems, outbox pattern, dead letter queue...etc) than our's. so we decided not to use it.

instead, we chose to use pgmq directly using raw SQL, especially that the pgmq commands are not too complex, so interacting with them directly would be easier than using the previous mentioned lib or bullmq.

the architecture followed is relatively simple:

- in `POST /subscriptions` we send a message to pgmq with needed info (I think we will need checkout.id only) and we set the delay to 15min.
- we create a background job, which is basically a nest service, and we annotate it with `@Interval('some_time_period')` from `@nestjs/schedule` so that the job gets triggered after each some_time_period
- the job will check the pgmq for any available messages and execute one (I think? but what if we have many msgs? we have to execute them too!) if found, where we check the chargilyPay API for the updated info and update our db accordingly
- if successful, we archive the msg (or remove it from the queue). if an error happened, we do nothing! pgmq will make the msg visible after the passing of `some_time_period` again so that the job gets it again and retry

**Notes**:

- we are using `@Interval()` here to emualate the MQ emitting the event to our nest app, since pgmq cannot do that (because it runs inside postgres and postgres cannot send us events or requests)
- we were thinking to abstract away the sql commands used to interact with pgmq in a `pgmq module` that will implement them and expose wrapper methods via its service. that module will be then used by the payment module to implement the background job

## Jobs Implementation

- the ChargilyPay endpoint to check for payment status update should be `checkouts/{id}` with the id of the checkout provided by us

from CharhilyPay docs:

```powershell
curl --request GET \
  --url https://pay.chargily.net/test/api/v2/checkouts/{id} \
  --header 'Authorization: Bearer <token>'
```

we should get a result that implements ChargilyPay Module's `Checkout` interface

## Explanation

There are two objectives:
1- get the payment status update from the payment service provider in case their webhook failed to update us. I thought in using two approaches:

- we use a cron job that runs evry 5min that checks the db for payment records with status of `PENDING` and with `createdAt` value older than 15min from the current time (we left 15min for the user to complete its payment process and for the payment service provider PSP to update us). then, we perform an API call to the PSP to get the latest status update. here we do not need PGMQ at all. the advantage for this method is it being simpler and easier than the next method

- we use a cron job that runs every 5min that pulls msgs from PGMQ. each msg is created when a user performs a payment, and it contains a `payment_id` or `checkout_id`. then we perform an API call to the PSP to get the latest status updates for this payments. if successful, we delete or archive (I choose to archive, since there are payment-related ops. and we should always keep records for them), else we do nothing; the next time the job will run, it will find the msgs again in the queue. this feature may be counted as an advantage to this method, as it guarantees that each msg will be procesed no-matter what, but I do not see how this is not the same case for 1st method. Another advantage to this method also is it being performant and more optimized than the 1st method: here we are querying a queue that will contain always only the `PENDING` payments, in opposite to the 1st method where we will be always querying the whole payments table. Here I was also thinking, since we are using a queue here, does this mean the job here will be classified as a "background job" rather than "cron" job since it is related and coupled to the queue data and not to a forcefully specified time interval

2- detect the "double" payments: payments for overlapping gym sessions for the same user: here a cron job is the best (and only) solution for this problem as we cannot solve it any earlier (before reacing the db) due to concurrency and race conditions between the PSP and our server (db transactions and db locks cannot solve this too). Basically, the cron job will run each `some_period_of_time` to check the db for the double payments and flag them as `REFUND_REQUIRED` so that the refund team (of humans) can review them and perform a rund operation.

## Solution Implementation

- [x] test ChargilyPay API endpoint
- [x] get Gemini boilerplate code as a starting point
- [x] setup PGMQ on the db
- [x] create a new PGMQ msg when a user pays online
- [x] write the background worker to verify the payment

- [x] implement graceful shutdown on PGMQ module (use nest hook `OnModuleDestroy` to close pool connections)

## PGMQ Setup

unlike GiST extension, for PGMQ to work we need to install external binaries, so prisma alone cannot init. the db.

when we tried to install PGMQ extension on Windows, we faced some problems, mainly because it is written in rust (pgx/pgrx) and is targeting POSIX systems (i.e: the installation does not offer dll files that Windows need, and to get them.. it will be a bit tricky), so we chose to use the SQL-only installation from PGMQ github docs, which is built for restricted envs (like in our case)

from the docs (modified):

```powershell
git clone https://github.com/pgmq/pgmq.git

cd pgmq

psql -f pgmq-extension/sql/pgmq.sql postgres://postgres:password@localhost:5432/postgres
```

we faced problems trying to setup PGMQ. Prisma is not compatible with PGMQ and cannot be used along with it: PGMQ tables exists in a different schema called 'pgmq' while the rest of tables Prisma manipulates exists in a schema called 'public'. there is no way to make Prisma connects to this schema (specifically, to make prisma's `.$queryRaw()` follow the new schema, there is a github issue related to this). Besides, we think that even if we COULD fix this, we will encounter a new problem: Prisma cannot parse the PGMQ returned msgs due to them having types that are incompatible with Prisma (Prisma cannot parse BigInt which PGMQ returns. PGMQ returns also JSONB but we don't know if Prisma can parse it). We encountered this problem before in a different place in this project (maybe with GiST? We got an issue also with TSTZRANGE type also where Prisma couldn't parse it either) but we were able to modify the column type from BigInt. However with PGMQ, we cannot. As we understand this is due to JSON not being able to parse BigInt since it only understand six basic types, but this makes me wonder: like that PGMQ will be un-usable for every programming language that uses JSON, but this is impossible since obviously there are folks out there using PGMQ. I wonder how they solved this issue

some of our tries:

```sql
-- Activate PGMQ extension
-- CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;

-- SET search_path TO public, pgmq;
-- ALTER DATABASE gymhouse SET search_path TO public, pgmq;
-- Create payments checks queue
SELECT pgmq.create('payments_checks_queue');
```

we understood better why Prisma struggles with BigInt. It is not because of JSON, but rather an internal serialization algorithm.

so we should not encounter issues of parsing if we used `pg` module for example.

as a result, we chose to branch out from Prisma, and use `pg` directly for PGMQ processing. we will create a new connection pool dedicated only to the message queue with a new connection string that selects `pgmq` schema in the db

we suppose creating a new module for managing PGMQ and wrapping its functions will be a good approach. we will go ahead and see

msg with ids= [1,2] should be deleted now after we used pgmq.pop
msg with id=3 should be archived
msg with id=4 should be deleted

if pgmq.send fails to execute, should we deny the subscription operation, or continue it (and like that considering the error of pgmq.send recoverable then?)

## Payment Checker Background Job

1. get the PGMQ message
2. from the db, get the payment record with transactionId from the PGMQ msg
3.

if status == PENDING:

- getCheckout(id)
- update the payment record accordingly

else: do nothing

4. if successful: archive or delete the PGMQ msg. if failed, do nothing, the msg will appear again in PGMQ after its `vt` has passed. then the job should get the msg again and re-run this from step 2

we found a possible bug here: we can find from `getCheckout` that the status is `PROCESSING` and the algorithm will update our db with this value. we don't want that, we want to be in a 'final state' (`PAID`, `FAILED`, `CANCELED`, `EXPIRED`), but `PROCESSING` in not
UPDATE: we think we fixed it

```sql
SELECT "transactionId"
FROM payments
WHERE "paymentStatus" = "ONLINE";
```

## Update to The Cron Job

after re-evaluating again, we may have found a better way to detect double payments than using a cron job that scans the whole payments table (while being joined with the subs and users tables): we use a background worker!

while the cron job will run the payment verification for all users, all subs and all related payment records, which is very compute intensive; a background worker that gets triggered after 15min from the payment registration time that will only verify that specific payment with its related user and subs, which is fat less compute intensive!

Basically, we can say that the cron job will be doing a many-to-many Join and verification operation, while the background worker will be doing a one-to-many join and verification operation

besides, the worker will scale better than the cron job later: the worker will scale linearly with the number of payments recieved, while the cron job will get slower and slower each time the payments, subs or users tables grow

in addition, if the worker fails in a certain msg, that msg will be back to the queue for it to be re-processed again the next time; while if the cron job fails in its batch operation, all of the batch will be delayed until the next execution (we were thinking in running the cron job once every night)

## Implementing IOT Control over Physical Gym Access

**objectives**:

- act as a security system to only allow registered members, with active sessions and within their allowed time schedule to access the gym
- act as an attendance registration system

### Implmentation

- **1st method**: the gym door has an IOT device that can open it, in addition to a screen device that displays a timed auto-generated QR code the members need to scan with their phones to open the door. the flow should be:
  - a member scans the QR code with the mobile client app
  - the client sends a request to nest API on endpoint `POST halls/:qr-code`
  - the nest backend verfies if the qr code is expired*, if the user has a payed subscription that day, and if the session time is located for his registered gender (male or female)
  - if verification passed, publish an MQTT msg to open the door. then, the IOT device should open it
  - else, we send an error msg to the mobile client app for explanation (e.g: 'you did not pay', 'wrong session time'...etc)

*the QR code repreents a generated authorization token with a short expiration time (15-30secs) that is created and sent to the IOT device by the nest backend. the short expiration time purpose is to deny the sharing the QR code via screenshot-ing and sending to other people (by the time the user takes the screenshot, opens a messaging app, chooses the photo and clicks 'send', the token would be expired)

- **2nd method**: we rely fully on MQTT for the whole communication process. here, we have an IOT device that opens the door and a QR scanner (or any code scanner). No screen device is needed. the flow is as follows:
  - a member opens the mobile device and shows a QR code representing their userId to the IOT scanner
  - the scanner sends the code via MQTT to nest
  - nest runs verification (if the user has a paid sub....)
  - if verification is passed, nest sends an `ACCESS_GRANTED` msg to the door IOT device via MQTT, then the door is opened
  - else, nest sends an `ACCESS_DENIED` msg via MQTT to the door IOT device, then the latter makes a "pip" sound that represents a 'feedback' or 'response' telling them their access is denied (instead of doing nothing and letting the user hanging not knowing if his request got processed or not)

in both methods, if the verification is passed, we register the attendance of the member on the db

### Flaws

we feel there is a serious flaw in this system, not in the implementaion, but rather in its objectives:

- if a group of members (e.g: s three friends) comes to the gym together, each one must enter individually (interact with IOT device, door gets open, THEN they has to close the door behind them) or the attendance system will be broken (we register the attendance of the 1st person and lose the attendance info of the next persons). This cannot happen since the 1st person will leave the door open for their friends to enter

thus, a better idea is to use those security doors we find in airports (or train stations or malls) that have a place to scan something for a steel/metal hand to get elevated/moved to enter to register the attendance

but for the 1st objective (security), we don't know what to propose. do we leave the usual door type?

### MQTT topics:

- turnstiles/:turnstileId/enter/scan (nest subscribes to)

- turnstiles/:turnstileId/enter/command (turnstile subscribes to)

- turnstiles/:turnstileId/exit (nest subscribes to)

## Testing MQTT

we can use the MQTT CLI from mqtt.js:

- to publish a message:

```powershell
'{"userId":4}' | mqtt publish `
>>   -h "HOSTNAME" `
>>   -p 8883 `
>>   -C mqtts `
>>   -u "USERNAME" `
>>   -P 'PASSWORD' `
>>   -t "TOPIC" `
>>   -s
```

`'{"userId":4}'` is an example of a JSON payload. we piped it through STDIN because using the `-m` flag did not work for JSON (the `'` and/or `"` were being removed)

- to subscribe to a topic:

```powershell
mqtt sub -h "HOSTNAME" -p 8883 -l mqtts -u "USERNAME" -P 'PASSWORD' -t "TOPIC"
```

```ts
function matchesMqttTopic(filter: string, topic: string): boolean {
  const filterLevels = filter.split('/');
  const topicLevels = topic.split('/');

  if (filterLevels.length !== topicLevels.length) {
    return false;
  }

  return filterLevels.every(
    (level, index) => level === '+' || level === topicLevels[index],
  );
}
```

## Important Point on MQTT QOS

Remember that QoS 2 delivery requires the subscriber to also subscribe with QoS 2 if you want end-to-end QoS 2 behavior.

## Important Note on Debugging Prisma

we encountered this error message from prisma

```powershell
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "gymhouse", schema "public" at "localhost:5432"

- The migration `20260825201355_add_constraints_session_table` failed.
- The migration `20260825201355_add_constraints_session_table` was modified after it was applied.

We need to reset the "public" schema at "localhost:5432"

You may use prisma migrate reset to drop the development database.
All data will be lost.
```

after trying to apply the following migration (then correcting the error in it in the same file)

```sql
ALTER TABLE "Session"
ADD CONSTRAINT valid_timeSlot_range CHECK(lower('timeSlot') < upper("timeSlot"));

ALTER TABLE "Session"
ADD CONSTRAINT no_overlapping_sessions
EXCLUDE USING Gist(
    "day" WITH =,
    "timeSlot" WITH &&
);
```

we did not go with the reset option since it is 'meaningless' (and costly as well since we're losing all sample data) here: the migration contained only one error at the 2nd line which is the use of `'` instead of `"`, so the migration did not even run, no damage was done to any table, and even if, the migration is only modifying a single table, that has no foreign keys to any other table, so a completely isolated case.

we tried running `npx prisma migrate resolve --rolled-back "20260825201355_add_constraints_to_session_table"`, but it did not work in this case. It may be due to Prisma still keeping a migration record on `_prisma_migrations` table

instead, we:

- deleted the migration record from `_prisma_migrations` table:

```sql
DELETE FROM _prisma_migrations
WHERE migration_name = '20260825203043_add_constraints_to_session_table';
```

- deleted the migration folder in `prisma/migrations`

- created a new migration and re-tried again

then, it worked!
