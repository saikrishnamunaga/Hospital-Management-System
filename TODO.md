# TODO - Add Names to Invoice Display

## Task Analysis
- Invoices showing "N/A" for patient and doctor names
- Need to display names properly in the Invoices component

## Plan
- [ ] Update Invoices.jsx to show patient name from direct patient field when appointment is null
- [ ] Improve doctor name display logic

## Changes Required
- [x] Analyzed core/models.py - Invoice model has both appointment and patient ForeignKeys
- [x] Analyzed core/serializers.py - InvoiceSerializer includes patient data
- [x] Analyzed core/views.py - InvoiceViewSet queries
- [ ] Update frontend/src/components/Invoices.jsx
