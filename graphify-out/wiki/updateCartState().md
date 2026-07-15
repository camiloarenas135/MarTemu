# updateCartState()

> God node · 6 connections · [C:\Users\camil\Desktop\MarTemu\src\App.tsx](file:///C:/Users/camil/Desktop/MarTemu/src/App.tsx#L115)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as updateCartState()
    participant P1 as writeSafeLocalStorage()
    participant P2 as handleSubmit()
    participant P3 as sanitizeString()
    participant P4 as checkRateLimit()
    participant P5 as sanitizePhone()
    participant P6 as recordAttempt()
    participant P7 as handleUnsubscribeMock()
    participant P8 as handleAddToCart()
    participant P9 as handleUpdateCartQuantity()
    participant P10 as handleRemoveCartItem()
    participant P11 as handleClearCart()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
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
    P0->>+ P8: calls
    P8-->>- P0: return
    P8->>+ P0: calls
    P0-->>- P8: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P9->>+ P0: calls
    P0-->>- P9: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
```

## Connections by Relation

### calls
- [[writeSafeLocalStorage()]] `INFERRED`
- [[handleAddToCart()]] `EXTRACTED`
- [[handleUpdateCartQuantity()]] `EXTRACTED`
- [[handleRemoveCartItem()]] `EXTRACTED`
- [[handleClearCart()]] `EXTRACTED`

### contains
- [[App.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*