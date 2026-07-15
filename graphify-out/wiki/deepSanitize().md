# deepSanitize()

> God node · 3 connections · [C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts](file:///C:/Users/camil/Desktop/MarTemu/src/utils/sanitize.ts#L83)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as deepSanitize()
    participant P1 as sanitizeString()
    participant P2 as handleCheckout()
    participant P3 as checkRateLimit()
    participant P4 as sanitizePhone()
    participant P5 as recordAttempt()
    participant P6 as formatCurrency()
    participant P7 as handleSubmit()
    participant P8 as writeSafeLocalStorage()
    participant P9 as handleSaveProduct()
    participant P10 as readSafeLocalStorage()
    P0->>+ P1: calls
    P1-->>- P0: return
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
    P7->>+ P3: calls
    P3-->>- P7: return
    P7->>+ P4: calls
    P4-->>- P7: return
    P7->>+ P5: calls
    P5-->>- P7: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P0->>+ P10: calls
    P10-->>- P0: return
```

## Connections by Relation

### calls
- [[sanitizeString()]] `EXTRACTED`
- [[readSafeLocalStorage()]] `EXTRACTED`

### contains
- [[sanitize.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*