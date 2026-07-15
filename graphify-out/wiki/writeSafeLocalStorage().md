# writeSafeLocalStorage()

> God node · 4 connections · [C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts](file:///C:/Users/camil/Desktop/MarTemu/src/utils/sanitize.ts#L45)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as writeSafeLocalStorage()
    participant P1 as updateCartState()
    participant P2 as handleAddToCart()
    participant P3 as handleUpdateCartQuantity()
    participant P4 as handleRemoveCartItem()
    participant P5 as handleClearCart()
    participant P6 as handleSubmit()
    participant P7 as sanitizeString()
    participant P8 as handleCheckout()
    participant P9 as deepSanitize()
    participant P10 as handleSaveProduct()
    participant P11 as checkRateLimit()
    participant P12 as sanitizePhone()
    participant P13 as recordAttempt()
    participant P14 as handleUnsubscribeMock()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P1->>+ P3: calls
    P3-->>- P1: return
    P3->>+ P1: calls
    P1-->>- P3: return
    P1->>+ P4: calls
    P4-->>- P1: return
    P4->>+ P1: calls
    P1-->>- P4: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P7: calls
    P7-->>- P6: return
    P7->>+ P8: calls
    P8-->>- P7: return
    P7->>+ P6: calls
    P6-->>- P7: return
    P7->>+ P9: calls
    P9-->>- P7: return
    P7->>+ P10: calls
    P10-->>- P7: return
    P6->>+ P0: calls
    P0-->>- P6: return
    P6->>+ P11: calls
    P11-->>- P6: return
    P6->>+ P12: calls
    P12-->>- P6: return
    P6->>+ P13: calls
    P13-->>- P6: return
    P0->>+ P14: calls
    P14-->>- P0: return
```

## Connections by Relation

### calls
- [[updateCartState()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[handleUnsubscribeMock()]] `INFERRED`

### contains
- [[sanitize.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*