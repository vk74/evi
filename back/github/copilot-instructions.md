  
The project is using TypeScript (with some parts still remain in JavaScript) and a layerd architecture with single responsibility concept - controllers, services, cache and other types of separate files each with single task. 
Our project is using several types of files:
  1. types.ts - contains interfaces for validation of data in incoming requests
  2. controller.ts - contains logic to capture incoming requests, handle connectivity issues, validate request data via interfaces from types.ts. validated requests are sent further to service.ts. replies from service.ts should be sent back to requestor.
  3. service.ts - contains business logic to working with requests.
  4. queries.ts - contains pre-created queries to be used for work with database. very usefull to neutralize sql injection attacks
  5. cache.ts - contains structures to temporarily store data to decrease database requests
  6. helper and core services functions - could be sevral types depending on helper or function. example - centralized logger service. 
  
Don't delete nor optimize code without my consent.  
Don't use classes in the files, use functions and methods instead. 
Add logging for major functions and events. the logging function is centralized.

For tasks related to Postgres database you can use MCP server to connect to maindb and explore the database structure.

Переписку в чатах ведем на русском, но все комментарии и код пишем на английском.

