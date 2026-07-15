# handleCheckout()

> God node · 6 connections · [C:\Users\camil\Desktop\MarTemu\src\components\Cart.tsx](file:///C:/Users/camil/Desktop/MarTemu/src/components/Cart.tsx#L63)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as handleCheckout()
    participant P1 as sanitizeString()
    participant P2 as handleSubmit()
    participant P3 as writeSafeLocalStorage()
    participant P4 as checkRateLimit()
    participant P5 as sanitizePhone()
    participant P6 as recordAttempt()
    participant P7 as deepSanitize()
    participant P8 as readSafeLocalStorage()
    participant P9 as handleSaveProduct()
    participant P10 as formatCurrency()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P1: calls
    P1-->>- P7: return
    P7->>+ P8: calls
    P8-->>- P7: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P0: calls
    P0-->>- P4: return
    P4->>+ P2: calls
    P2-->>- P4: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
```

## Connections by Relation

### calls
- [[sanitizeString()]] `INFERRED`
- [[checkRateLimit()]] `INFERRED`
- [[sanitizePhone()]] `INFERRED`
- [[recordAttempt()]] `INFERRED`
- [[formatCurrency()]] `EXTRACTED`

### contains
- [[Cart.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*