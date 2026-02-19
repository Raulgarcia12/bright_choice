/**
 * Winston Logger
 * Structured logging for the scraper service.
 */
import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'bright-choice-scraper' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    ({ timestamp, level, message, service, brand, ...meta }) => {
                        const brandTag = brand ? ` [${brand}]` : '';
                        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${timestamp} ${level}${brandTag}: ${message}${extra}`;
                    }
                )
            ),
        }),
    ],
});
