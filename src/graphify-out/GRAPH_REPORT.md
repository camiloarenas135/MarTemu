# Graph Report - C:\Users\camil\Desktop\MarTemu\src  (2026-07-12)

## Corpus Check
- 16 files · ~16,715 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 200 nodes · 206 edges · 14 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `updateCartState()` - 6 edges
2. `handleCheckout()` - 6 edges
3. `handleSubmit()` - 6 edges
4. `sanitizeString()` - 5 edges
5. `writeSafeLocalStorage()` - 4 edges
6. `processAndUploadFile()` - 3 edges
7. `checkRateLimit()` - 3 edges
8. `recordAttempt()` - 3 edges
9. `sanitizePhone()` - 3 edges
10. `deepSanitize()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `updateCartState()` --calls--> `writeSafeLocalStorage()`  [INFERRED]
  C:\Users\camil\Desktop\MarTemu\src\App.tsx → C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts
- `handleSaveProduct()` --calls--> `sanitizeString()`  [INFERRED]
  C:\Users\camil\Desktop\MarTemu\src\components\AdminCatalog.tsx → C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts
- `handleCheckout()` --calls--> `checkRateLimit()`  [INFERRED]
  C:\Users\camil\Desktop\MarTemu\src\components\Cart.tsx → C:\Users\camil\Desktop\MarTemu\src\utils\rateLimiter.ts
- `handleCheckout()` --calls--> `sanitizeString()`  [INFERRED]
  C:\Users\camil\Desktop\MarTemu\src\components\Cart.tsx → C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts
- `handleCheckout()` --calls--> `sanitizePhone()`  [INFERRED]
  C:\Users\camil\Desktop\MarTemu\src\components\Cart.tsx → C:\Users\camil\Desktop\MarTemu\src\utils\sanitize.ts

## Communities

### Community 0 - "Community 0"
_Handles image cropping, editing, and metadata for product listings._
Cohesion: 0.04
Nodes (35): canvas, CATEGORIES, [category, setCategory], coords, [cropperFile, setCropperFile], [cropperIndex, setCropperIndex], [cropperSrc, setCropperSrc], ctx (+27 more)

### Community 1 - "Community 1"
_Handles the state, filtering, sorting, and selection logic for browsing products in an e-commerce application._
Cohesion: 0.08
Nodes (20): [activeImageIndex, setActiveImageIndex], CATEGORIES, categoryProducts, existingPreloads, filteredProducts, isBestSeller, [isFilterPanelOpen, setIsFilterPanelOpen], isFreeShipping (+12 more)

### Community 2 - "Community 2"

Cohesion: 0.12
Nodes (19): handleSaveProduct(), formatCurrency(), handleCheckout(), checkRateLimit(), recordAttempt(), deepSanitize(), readSafeLocalStorage(), sanitizePhone() (+11 more)

### Community 3 - "Community 3"

Cohesion: 0.11
Nodes (17): cartCount, [cartItems, setCartItems], handleAddToCart(), handleClearCart(), handleRemoveCartItem(), handleUpdateCartQuantity(), isAdminRoute, [isCartOpen, setIsCartOpen] (+9 more)

### Community 4 - "Community 4"
_Handles user subscription status, orders, VIP membership, session data, and UI state in the account area._
Cohesion: 0.12
Nodes (10): [activeSubTab, setActiveSubTab], allowedEmails, { data: { subscription } }, [errorMsg, setErrorMsg], [forceEditProduct, setForceEditProduct], [isDataLoading, setIsDataLoading], [isLoading, setIsLoading], [orders, setOrders] (+2 more)

### Community 5 - "Community 5"
_Manages user information, payment options, order totals, and checkout success state for completing a purchase._
Cohesion: 0.12
Nodes (15): [checkoutSuccess, setCheckoutSuccess], colorMap, colors, [customerName, setCustomerName], [customerPhone, setCustomerPhone], [deliveryAddress, setDeliveryAddress], [errorMessage, setErrorMessage], Icon (+7 more)

### Community 6 - "Community 6"
_Monitors and presents inventory levels, indicating critical or out-of-stock items and managing related UI alerts._
Cohesion: 0.15
Nodes (11): categoryStats, hasCriticalStock, hasOutOfStock, outOfStockCount, outOfStockItems, semaphoreStyle, semaphoreText, [showOutOfStockModal, setShowOutOfStockModal] (+3 more)

### Community 7 - "Community 7"

Cohesion: 0.15
Nodes (10): DEFAULT_ORDERS, DEFAULT_PRODUCTS, DEFAULT_VIP, isRealSupabaseConfigured, mockDb, mockSupabaseClient, realSupabase, supabase (+2 more)

### Community 8 - "Community 8"

Cohesion: 0.2
Nodes (5): [activeFilter, setActiveFilter], [confirmModal, setConfirmModal], [errorMessage, setErrorMessage], filteredOrders, [isProcessing, setIsProcessing]

### Community 9 - "Community 9"

Cohesion: 0.33
Nodes (3): [deleteConfirmId, setDeleteConfirmId], [errorMessage, setErrorMessage], [isDeleting, setIsDeleting]

### Community 10 - "Community 10"
_Manages user file selection, drag‑and‑drop events, and uploads the chosen files to the server._
Cohesion: 0.67
Nodes (3): handleDrop(), handleFileChange(), processAndUploadFile()

### Community 11 - "Community 11"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"

Cohesion: 1.0
Nodes (1): [isMobileSearchOpen, setIsMobileSearchOpen]

### Community 13 - "Community 13"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **129 isolated node(s):** `{ pathname, navigate }`, `isAdminRoute`, `[isCartOpen, setIsCartOpen]`, `[isVIPOpen, setIsVIPOpen]`, `[products, setProducts]` (+124 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `Footer.tsx`, `Footer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `Header.tsx`, `[isMobileSearchOpen, setIsMobileSearchOpen]`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.