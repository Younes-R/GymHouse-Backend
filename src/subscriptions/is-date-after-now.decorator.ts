import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint()
export class IsDateAfterNowConstraint implements ValidatorConstraintInterface {
  private isDateAfterNow(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    return date.getUTCFullYear() > now.getUTCFullYear()
      ? true
      : date.getUTCFullYear() == now.getUTCFullYear() &&
          date.getUTCMonth() > now.getUTCMonth()
        ? true
        : date.getUTCFullYear() == now.getUTCFullYear() &&
            date.getUTCMonth() == now.getUTCMonth() &&
            date.getUTCDate() > now.getUTCDate()
          ? true
          : date.getUTCFullYear() == now.getUTCFullYear() &&
              date.getUTCMonth() == now.getUTCMonth() &&
              date.getUTCDate() == now.getUTCDate()
            ? true
            : false;
  }

  validate(date: string, args: ValidationArguments) {
    return this.isDateAfterNow(date);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Minimal allowed value for $property is ${new Date().toDateString()}`;
  }
}

export function IsDateAfterNow(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateAfterNowConstraint,
    });
  };
}
