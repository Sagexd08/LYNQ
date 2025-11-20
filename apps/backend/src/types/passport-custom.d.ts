declare module 'passport-custom' {
    import { Strategy as PassportStrategy } from 'passport-strategy';
    import { Request } from 'express';

    export interface StrategyOptions {
        passReqToCallback?: boolean;
    }

    export type VerifyCallback = (req: Request, done: (error: any, user?: any, info?: any) => void) => void;

    export class Strategy extends PassportStrategy {
        constructor(verify: VerifyCallback);
        constructor(options: StrategyOptions, verify: VerifyCallback);
    }
}
