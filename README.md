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
