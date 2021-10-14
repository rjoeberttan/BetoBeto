# BetoBeto


## Accounts Microservice

#### POST REGISTER
**Requires:** api-key, email, username, cell_no, password, agent_id  
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
**Requires:** api-key, email, username, cell_no, password, agent_id  
**Responses:**  
*   **401:** Missing API Key  
*   **500:** Server General Error  
*   **400:** Missing Data in Body  
*   **409:** Username not found  
*   **409:** Wrong Password  
*   **200:** Success  
<br>
<br>


