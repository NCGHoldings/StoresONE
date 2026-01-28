

# Fix POS Return Credit Note Reason Mapping

## Problem Identified

The Edge Function logs show a check constraint violation:

```
'new row for relation "credit_notes" violates check constraint "credit_notes_reason_check"'
```

The function is inserting `defective` into the `credit_notes.reason` column, but this column only accepts:
- `return`
- `adjustment`
- `pricing_error`
- `goodwill`
- `other`

---

## Root Cause

| Table | Column | Allowed Values | Current Value |
|-------|--------|----------------|---------------|
| `sales_returns` | `return_reason` | `defective`, `wrong_item`, `damaged`, `customer_request`, `other` | `defective` (correct) |
| `credit_notes` | `reason` | `return`, `adjustment`, `pricing_error`, `goodwill`, `other` | `defective` (wrong) |

Line 449 in `pos-return/index.ts`:
```typescript
reason: payload.return_reason,  // Wrong - using 'defective'
```

Should be:
```typescript
reason: 'return',  // Correct - POS returns are always 'return' type credit notes
```

---

## Solution

Update the credit note creation in `supabase/functions/pos-return/index.ts` to use `'return'` as the reason for all POS-originated credit notes.

### Code Change

```typescript
// Line 449 - Change from:
reason: payload.return_reason,

// To:
reason: 'return',  // POS returns always use 'return' as credit note reason
```

This makes sense because:
- `sales_returns.return_reason` captures WHY the customer returned (defective, damaged, etc.)
- `credit_notes.reason` captures TYPE of credit note (return, adjustment, goodwill, etc.)
- All POS returns should create credit notes of type `'return'`

---

## File to Modify

| File | Change |
|------|--------|
| `supabase/functions/pos-return/index.ts` | Line 449: Change `reason: payload.return_reason` to `reason: 'return'` |

---

## Expected Flow After Fix

```text
1. POS sends return with reason "defective" ✓
2. Create sales_returns with return_reason = "defective" ✓
3. Create sales_return_lines ✓
4. Create credit_notes with reason = "return" ✓ (FIXED)
5. Create credit_note_applications ✓
6. Update customer_invoices amount_paid ✓
```

---

## Implementation Details

The fix is on line 449 of the Edge Function:

```typescript
// Current (BROKEN)
const { data: creditNote, error: cnError } = await supabase
  .from("credit_notes")
  .insert({
    credit_note_number: creditNoteNumber,
    customer_id: invoice.customer_id,
    invoice_id: invoice.id,
    sales_return_id: salesReturn.id,
    credit_date: todayStr,
    amount: payload.refund_amount,
    amount_applied: payload.refund_amount,
    reason: payload.return_reason,      // ❌ Wrong - 'defective' not allowed
    status: "applied",
    notes: `POS Return - ${returnNumber} - Terminal: ${payload.pos_terminal_id}`,
  })

// Fixed
const { data: creditNote, error: cnError } = await supabase
  .from("credit_notes")
  .insert({
    credit_note_number: creditNoteNumber,
    customer_id: invoice.customer_id,
    invoice_id: invoice.id,
    sales_return_id: salesReturn.id,
    credit_date: todayStr,
    amount: payload.refund_amount,
    amount_applied: payload.refund_amount,
    reason: 'return',                   // ✓ Correct - valid credit note type
    status: "applied",
    notes: `POS Return - ${returnNumber} - Terminal: ${payload.pos_terminal_id}`,
  })
```

---

## Testing After Fix

1. Deploy updated Edge Function
2. Process a return for POS-2026-6165 from the POS system
3. Verify in ERP:
   - AR > Credit Notes tab shows new credit note
   - Credit note has reason = "return"
   - Invoice POS-2026-6165 shows updated balance
   - Invoice status changes to "paid" or "partial" based on amount

---

## Summary

| Step | Before Fix | After Fix |
|------|------------|-----------|
| Sales Return | Created (return_reason: defective) | Created (return_reason: defective) |
| Return Lines | Created | Created |
| Credit Note | FAILS (reason: defective not allowed) | WORKS (reason: return) |
| Invoice Update | Never reached | Updates amount_paid |
| AR Credit Notes | Empty | Shows credit note |

