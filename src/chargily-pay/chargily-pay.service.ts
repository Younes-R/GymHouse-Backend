import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Checkout } from './interfaces/checkout.interface';
import { Request } from 'express';
import { createHmac } from 'crypto';

@Injectable()
export class ChargilyPayService {
  constructor(private configService: ConfigService) {
    this.CHARGILY_PAY_SECRET_KEY = this.configService.getOrThrow<string>(
      'CHARGILY_PAY_SECRET_KEY',
    );
    this.CHARGILY_PAY_BASE_URL = this.configService.getOrThrow<string>(
      'CHARGILY_PAY_BASE_URL',
    );
    this.SUCCESS_URL = this.configService.getOrThrow<string>('SUCCESS_URL');
    this.FAILURE_URL = this.configService.getOrThrow<string>('FAILURE_URL');
    this.WEBHOOK_ENDPOINT =
      this.configService.getOrThrow<string>('WEBHOOK_ENDPOINT');
    this.CURRENCY = 'dzd';
  }

  private readonly CHARGILY_PAY_SECRET_KEY: string;
  private readonly CHARGILY_PAY_BASE_URL: string;
  private readonly SUCCESS_URL: string;
  private readonly FAILURE_URL: string;
  private readonly WEBHOOK_ENDPOINT: string;
  private readonly CURRENCY: string;

  async createCheckout(amount: number): Promise<Checkout> {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.CHARGILY_PAY_SECRET_KEY}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: this.CURRENCY,
        success_url: this.SUCCESS_URL,
        failure_url: this.FAILURE_URL,
        webhook_endpoint: this.WEBHOOK_ENDPOINT,
      }),
    };

    try {
      const checkoutResponse = await fetch(this.CHARGILY_PAY_BASE_URL, options);

      if (!checkoutResponse.ok) throw new Error(await checkoutResponse.text());

      return await checkoutResponse.json();
    } catch (err) {
      throw new Error('Could not create a checkout', { cause: err });
    }
  }

  async getCheckout(id: string) {
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.CHARGILY_PAY_SECRET_KEY}`,
        'Content-type': 'application/json',
      },
    };

    try {
      const checkoutResponse = await fetch(
        `${this.CHARGILY_PAY_BASE_URL}/${id}`,
        options,
      );

      if (!checkoutResponse.ok) throw new Error(await checkoutResponse.text());

      return await checkoutResponse.json();
    } catch (err) {
      throw new Error('Could not get checkout', { cause: err });
    }
  }

  verifyRequest(
    signatureHeader: string,
    request: Request & { rawBody: string },
  ) {
    const computedSignature = createHmac('sha256', this.CHARGILY_PAY_SECRET_KEY)
      .update(request.rawBody)
      .digest('hex');

    const isSignature = !!signatureHeader;
    const isRequestValid = computedSignature === signatureHeader;

    return { isSignature, isRequestValid };
  }
}
