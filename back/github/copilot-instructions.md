  
We have migrated project to TypeScript, no files are in JavaScript any more. The project is using a layerd architecture with single responsibility concept - controllers, services, cache and other types of separate files each with single task. Here are most common roles of files:
  1. types - contains interfaces for validation of data in incoming requests
  2. controller - contains logic to capture incoming requests, handle connectivity issues, validate request data via interfaces from types.ts. validated requests are sent further to service.ts. replies from service.ts should be sent back to requestor.
  3. service - contains business logic to working with requests.
  4. queries - contains pre-created queries to be used for work with database. very usefull to neutralize sql injection attacks
  5. cache - contains structures to temporarily store data to decrease database requests
  6. helper and core services functions - could be sevral types depending on helper or function. example - centralized logger service. 
  7. role specifics for other functions will be provided in the chat context.

For new modules and functions you need to split responsibilities in the above named roles (1 file - 1 responsibility).

Add or correct comments in files
  1. all comments in all files should be in english
  2. the header comment should have:
    a. file version: if this is a new file put version 1.0.0. if we work on an existing file, you need to increment version by 01, for example 1.0 -> 1.0.01 -> 1.0.02, 1.0.99 -> 1.1.0, etc.
    b. an explanation of the file functionality / algorythm, what type of objects the file is working with, major interactions. 
    c. comment should should mention this is a backend file, should contain file name but no path to the file

Don't delete nor optimize code without my consent.  

Don't use classes in the files, use functions and methods instead. 

Do not use centralized lgr function for logging. Instead we are using an event bus - all modules are expected to generate events using own events dictionaries and send it to events factory for events generation. Logger function is subscribed to all events, so logging will be done automatically. For temporary or debugging reasons we should use console.log command. 

For tasks related to Postgres database you can use MCP server and #query to connect to 'maindb' database. All ev2 application data is in app. schema.

Переписку в чатах ведем на русском, но все комментарии и код пишем на английском.