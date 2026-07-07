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
- backend verifies if the client has a valid subscription that day, if he did not attend beforethat day, and if his gender is the same as the one mentioned in the sessions schedule
  if yes: send a response to open the door; a response with ACTION='OPEN_DOOR' or ACCESS='ALLOWED' to the door, and a confirmation msg (or 200 OK) to the user mobile
  if no: send a response to user to inform him that access is denied
