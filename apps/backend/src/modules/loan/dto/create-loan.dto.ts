import { IsString, IsNumber, IsEnum, IsPositive, Min, Max, Matches, IsOptional, ValidateIf, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SupportedChain {
    EVM = 'evm',
    APTOS = 'aptos',
    FLOW = 'flow',
    MANTLE = 'mantle',
    MANTLE_SEPOLIA = 'mantleSepolia',
}

export const MIN_LOAN_AMOUNT = '10';
export const MAX_LOAN_AMOUNT = '1000000';
export const MIN_COLLATERAL_RATIO = 1.5;

function IsDecimalInRange(min: string, max: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isDecimalInRange',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') return false;
                    const num = parseFloat(value);
                    if (isNaN(num)) return false;
                    const minNum = parseFloat(min);
                    const maxNum = parseFloat(max);
                    return num >= minNum && num <= maxNum;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be between ${min} and ${max}`;
                },
            },
        });
    };
}

function IsPositiveDecimal(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPositiveDecimal',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (typeof value !== 'string') return false;
                    const num = parseFloat(value);
                    return !isNaN(num) && num > 0;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a positive number`;
                },
            },
        });
    };
}

function IsValidCollateralRatio(minRatio: number, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidCollateralRatio',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const obj = args.object as CreateLoanDto;
                    if (typeof value !== 'string' || typeof obj.amount !== 'string') return false;
                    const collateral = parseFloat(value);
                    const loan = parseFloat(obj.amount);
                    if (isNaN(collateral) || isNaN(loan) || loan === 0) return false;
                    const ratio = collateral / loan;
                    return ratio >= minRatio;
                },
                defaultMessage(args: ValidationArguments) {
                    return `Collateral ratio must be at least ${minRatio}x (collateral/loan)`;
                },
            },
        });
    };
}

export class CreateLoanDto {
    @ApiProperty({ 
        example: '1000.00',
        description: `Loan amount in decimal format. Min: ${MIN_LOAN_AMOUNT}, Max: ${MAX_LOAN_AMOUNT}`,
        minimum: parseFloat(MIN_LOAN_AMOUNT),
        maximum: parseFloat(MAX_LOAN_AMOUNT),
    })
    @IsString()
    @Matches(/^(\d+\.?\d*|\d*\.\d+)$/, {
        message: 'amount must be a valid decimal number (no scientific notation)'
    })
    @IsPositiveDecimal({ message: 'amount must be a positive number' })
    @IsDecimalInRange(MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT, {
        message: `amount must be between ${MIN_LOAN_AMOUNT} and ${MAX_LOAN_AMOUNT}`
    })
    amount!: string;

    @ApiProperty({ 
        enum: SupportedChain, 
        example: SupportedChain.EVM,
        description: 'Blockchain network for the loan'
    })
    @IsEnum(SupportedChain, {
        message: `chain must be one of: ${Object.values(SupportedChain).join(', ')}`
    })
    chain!: SupportedChain;

    @ApiProperty({ 
        example: '0x1234567890123456789012345678901234567890',
        description: 'EVM-style address (0x prefixed, 40 hex chars)'
    })
    @IsString()
    @Matches(/^0x[0-9a-fA-F]{40}$/, {
        message: 'collateralTokenAddress must be a valid Ethereum address (0x + 40 hex chars)'
    })
    collateralTokenAddress!: string;

    @ApiProperty({ 
        example: '2000.00',
        description: `Collateral amount in decimal format. Must be at least ${MIN_COLLATERAL_RATIO}x the loan amount`
    })
    @IsString()
    @Matches(/^(\d+\.?\d*|\d*\.\d+)$/, {
        message: 'collateralAmount must be a valid decimal number (no scientific notation)'
    })
    @IsPositiveDecimal({ message: 'collateralAmount must be a positive number' })
    @IsValidCollateralRatio(MIN_COLLATERAL_RATIO, {
        message: `Collateral must be at least ${MIN_COLLATERAL_RATIO}x the loan amount`
    })
    collateralAmount!: string;

    @ApiProperty({ 
        example: 30, 
        minimum: 7, 
        maximum: 365,
        description: 'Loan duration in days'
    })
    @IsNumber()
    @IsPositive()
    @Min(7, { message: 'durationDays must be at least 7 days' })
    @Max(365, { message: 'durationDays must be at most 365 days' })
    durationDays!: number;

    @ApiProperty({ 
        example: '0x1234567890123456789012345678901234567890123456789012345678901234', 
        required: false,
        description: 'Transaction hash for on-chain loan creation (64 hex chars after 0x)'
    })
    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.transactionHash !== undefined && o.transactionHash !== '')
    @Matches(/^0x[0-9a-fA-F]{64}$/, {
        message: 'transactionHash must be a valid transaction hash (0x + 64 hex chars)'
    })
    transactionHash?: string;

    @ApiProperty({ 
        example: '1', 
        required: false,
        description: 'On-chain loan ID from smart contract'
    })
    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.onChainId !== undefined && o.onChainId !== '')
    @Matches(/^\d+$/, {
        message: 'onChainId must be a numeric string'
    })
    onChainId?: string;
}

export class LoanAmountLimits {
    static readonly MIN = MIN_LOAN_AMOUNT;
    static readonly MAX = MAX_LOAN_AMOUNT;
    static readonly MIN_COLLATERAL_RATIO = MIN_COLLATERAL_RATIO;
}
