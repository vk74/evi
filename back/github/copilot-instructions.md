  
The project is using TypeScript (with some parts still remain in JavaScript) and a layerd architecture with single responsibility concept - controllers, services, cache and other types of separate files each with single task. 
Our project is using several types of files:
  1. types.ts - contains interfaces for validation of data in incoming requests
  2. controller.ts - contains logic to capture incoming requests, handle connectivity issues, validate request data via interfaces from types.ts. validated requests are sent further to service.ts. replies from service.ts should be sent back to requestor.
  3. service.ts - contains business logic to working with requests.
  4. queries.ts - contains pre-created queries to be used for work with database. very usefull to neutralize sql injection attacks
  5. cache.ts - contains structures to temporarily store data to decrease database requests
  6. helper and core services functions - could be sevral types depending on helper or function. example - centralized logger service. 
  7. for other functions specifics will be provided in the chat context.

Comments in files
  1. all comments in all files should be in english
  2. the header comment should have:
    a. file version: if this is a new file put version 1.0. if we work on a file - increment version by 001.
    b. an explanation of the file functionality / algorythm, what type of objects it is working with, major interactions. 
    c. comment should should mention this is a backend file, should contain file name but no path to the file

Don't delete nor optimize code without my consent.  

Don't use classes in the files, use functions and methods instead. 

Do not use centralized lgr function for logging. We are going to switch to a new logger function soon.

For tasks related to Postgres database you can use MCP server to #query maindb, app.schema and explore the database structure.

Переписку в чатах ведем на русском, но все комментарии и код пишем на английском.

