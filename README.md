# BetoBeto


## Accounts Microservice

#### POST REGISTER
**Requires:** apiKey, email, username, phone, password, agentId  
**Responses:**  
*  **401:** Missing API Key  
*  **500:** Server General Error  
*  **400:** Missing Data in Body  
*  **409:** Username or Email already used  
*  **409:** Agent ID not found  
*  **409:** Agent account type error  
*  **200:** Success  
<br>
<br>

#### POST LOGIN  
**Requires:** apiKey, username, password, agentId  
**Responses:**  
*   **401:** Missing API Key  
*   **500:** Server General Error  
*   **400:** Missing Data in Body  
*   **409:** Username not found  
*   **409:** Wrong Password  
*   **200:** Success  
<br>
<br>

#### GET isUserAuth
**Requires**: token, apiKey  
**Responses:**
*   **401:** Missing API Key  
*   **401:** Missing token  
*   **401:** Expired token  
*   **500:** Server error  
*   **200:** Success  
<br>
<br>

#### GET getUserDetails - to be used only for single users  
**Requires:** accountId, apiKey  
**Responses:**
*   **500** - General Error  
*   **401** - Unauthorized Request  
*   **400** - Missing parameters  
*   **409** - Account not found  
*   **200** - Success  
<br>
<br>

#### GET getWalletBalance - to be used only for single users  
**Requires:** accountId, apiKey  
**Responses:**
*   **500** - General Error  
*   **401** - Unauthorized Request  
*   **400** - Missing parameters  
*   **409** - Account not found  
*   **200** - Success  
<br>
<br>


