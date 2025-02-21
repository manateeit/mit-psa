# Email Registration System Documentation

## Overview

The email registration system allows clients to self-register using their company email addresses. The system supports two registration flows:
1. Contact-based registration (existing functionality)
2. Email suffix-based registration (new functionality)

## Architecture

### Database Tables

1. `company_email_settings`
   - Stores allowed email suffixes for each company
   - Reference table in CitusDB environment
   - Includes self-registration toggle per suffix

2. `pending_registrations`
   - Tracks registration attempts and their status
   - Distributed table in CitusDB environment
   - Statuses: PENDING_VERIFICATION, VERIFIED, COMPLETED, EXPIRED

3. `verification_tokens`
   - Manages email verification tokens
   - Reference table in CitusDB environment
   - Includes expiration and usage tracking

### Security Measures

1. Rate Limiting
   - Registration attempts: 5 per hour per email
   - Verification attempts: 3 per 5 minutes per token
   - Email sending: 3 per hour per email

2. Token Security
   - 32-byte random tokens using crypto library
   - Base64URL encoding for URL safety
   - 24-hour expiration
   - One-time use only

3. Audit Logging
   - All security events are logged
   - Events include registration attempts, verifications, and expirations
   - Logs include tenant isolation

### Registration Flow

1. User submits registration form
   - System checks for existing contact
   - If not a contact, validates email suffix
   - Creates pending registration and verification token
   - Sends verification email

2. User verifies email
   - Clicks link in email
   - System validates token
   - Updates registration status to VERIFIED

3. System completes registration
   - Creates user account
   - Assigns appropriate role (client_admin for first user)
   - Updates registration status to COMPLETED

## Maintenance

### Cleanup Jobs

Two cleanup jobs run hourly:

1. `cleanupExpiredRegistrations`
   - Finds registrations past expiration
   - Updates status to EXPIRED
   - Logs cleanup events

2. `cleanupExpiredTokens`
   - Removes expired verification tokens
   - Only removes unused tokens
   - Maintains audit trail

### Monitoring

Monitor these aspects:

1. Registration Attempts
   - Watch for unusual patterns
   - Track success/failure rates
   - Monitor rate limit hits

2. Token Usage
   - Track verification success rates
   - Monitor token expiration patterns
   - Watch for repeated failures

3. Email Delivery
   - Monitor sending success rates
   - Track delivery delays
   - Watch for bounces

### Troubleshooting

Common issues and solutions:

1. Rate Limit Exceeded
   - Check logs for abuse patterns
   - Verify limit configurations
   - Consider adjusting limits if needed

2. Token Verification Failures
   - Check token expiration times
   - Verify email delivery
   - Look for multiple attempts

3. Role Assignment Issues
   - Verify role existence
   - Check tenant isolation
   - Validate company settings

## Administration

### Company Settings

Administrators can:
- Add/remove allowed email suffixes
- Toggle self-registration per suffix
- View registration activity
- Manage existing registrations

### Security Settings

Available controls:
- Rate limit configurations
- Token expiration times
- Email sending limits
- IP-based restrictions

## Best Practices

1. Email Suffixes
   - Use specific suffixes when possible
   - Avoid common email providers
   - Regularly review and update

2. Security
   - Monitor audit logs regularly
   - Review rate limits periodically
   - Keep email templates updated

3. Maintenance
   - Check cleanup job logs
   - Monitor database size
   - Review expired registrations

## Deployment

### Prerequisites
- PostgreSQL or CitusDB
- Node.js environment
- Email service configuration

### Configuration Steps
1. Run database migrations
2. Configure email service
3. Set environment variables
4. Enable cleanup jobs

### Rollback Procedures
1. Disable new registrations
2. Revert database migrations
3. Remove email settings

## Troubleshooting Guide

### Common Issues

1. Registration Fails
   - Check email suffix configuration
   - Verify rate limits
   - Check database connectivity

2. Verification Link Invalid
   - Check token expiration
   - Verify token usage
   - Check email delivery logs

3. Role Assignment Fails
   - Verify role existence
   - Check tenant configuration
   - Validate company settings

### Monitoring Checklist

Daily:
- Check registration success rates
- Monitor verification attempts
- Review security logs

Weekly:
- Analyze rate limit patterns
- Check cleanup job effectiveness
- Review expired registrations

Monthly:
- Audit email suffix configurations
- Review security settings
- Check system performance

## Support

For issues:
1. Check audit logs first
2. Review rate limit status
3. Verify email delivery
4. Check database consistency

## Future Improvements

Planned enhancements:
1. Enhanced rate limiting
2. IP-based restrictions
3. Improved monitoring
4. Additional security measures
