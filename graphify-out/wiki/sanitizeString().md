# sanitizeString()

> God node · 5 connections · [C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts](file:///C:/Users/camil/Desktop/MarTemu/src/utils/sanitize.ts#L9)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sanitizeString()
    participant P1 as handleCheckout()
    participant P2 as checkRateLimit()
    participant P3 as handleSubmit()
    participant P4 as sanitizePhone()
    participant P5 as recordAttempt()
    participant P6 as formatCurrency()
    participant P7 as writeSafeLocalStorage()
    participant P8 as deepSanitize()
    participant P9 as handleSaveProduct()
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
    P1->>+ P4: calls
    P4-->>- P1: return
    P4->>+ P1: calls
    P1-->>- P4: return
    P4->>+ P3: calls
    P3-->>- P4: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P3: calls
    P3-->>- P5: return
    P1->>+ P6: calls
    P6-->>- P1: return
    P6->>+ P1: calls
    P1-->>- P6: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P3->>+ P0: calls
    P0-->>- P3: return
    P3->>+ P7: calls
    P7-->>- P3: return
    P3->>+ P2: calls
    P2-->>- P3: return
    P3->>+ P4: calls
    P4-->>- P3: return
    P3->>+ P5: calls
    P5-->>- P3: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
```

## Connections by Relation

### calls
- [[handleCheckout()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[deepSanitize()]] `EXTRACTED`
- [[handleSaveProduct()]] `INFERRED`

### contains
- [[sanitize.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*