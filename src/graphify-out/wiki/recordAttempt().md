# recordAttempt()

> God node · 3 connections · [C:\Users\camil\Desktop\MarTemu\src\utils\rateLimiter.ts](file:///C:/Users/camil/Desktop/MarTemu/src/utils/rateLimiter.ts#L62)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as recordAttempt()
    participant P1 as handleCheckout()
    participant P2 as sanitizeString()
    participant P3 as handleSubmit()
    participant P4 as deepSanitize()
    participant P5 as handleSaveProduct()
    participant P6 as checkRateLimit()
    participant P7 as sanitizePhone()
    participant P8 as formatCurrency()
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
    P1->>+ P6: calls
    P6-->>- P1: return
    P6->>+ P1: calls
    P1-->>- P6: return
    P6->>+ P3: calls
    P3-->>- P6: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P1: calls
    P1-->>- P7: return
    P7->>+ P3: calls
    P3-->>- P7: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P0->>+ P3: calls
    P3-->>- P0: return
```

## Connections by Relation

### calls
- [[handleCheckout()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`

### contains
- [[rateLimiter.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*