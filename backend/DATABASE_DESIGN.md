# Secure Pharma Database Design

## Core Entities

### User
Represents an authenticated application user.

### Organization
Represents a pharmaceutical organization.

### License
Stores license metadata and document reference.

### Verification
Tracks license verification and approval.

### Product
Represents a pharmaceutical product.

### Batch
Represents a production batch.

### SupplyChainEvent
Tracks movement of pharmaceutical batches.

### AuditLog
Tracks important system actions.

## Relationships

User
- belongs to Organization
- has License
- creates AuditLog entries

Organization
- has Users
- has License
- creates Products
- participates in SupplyChainEvents

License
- has Verification records

Product
- has Batches

Batch
- has SupplyChainEvents

Verification
- may be reviewed by Admin or Regulator
