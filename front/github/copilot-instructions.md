  
The project is using TypeScript (with some parts still remain in JavaScript) and a layerd architecture with single responsibility concept - services, types, cache and other types of separate files each with single task. 
Our project is using several types of files:
  1. types.ts - contains interfaces for validation of data
  2. service.ts - contains business logic mainly to service .vue components CRUD processes.
  3. helper and core services functions - could be sevral types depending on helper or function. example - centralized logger service. 
  
Don't delete nor optimize code without my consent.  
Don't use classes in TypeScript and JavaScript files, use functions and methods instead. 

Preferences for .vue components:
  1. add console logging for major functions and events
  2. for major events like successfull component operation completion, errors, warnings, use snackbar messages which is a global component in front/core/ui/snackbars.
  3. start building components with interface language in russian. internationalization with i18 library should be done as a separate step upon component functionality completion. 
  4. use CompositionAPI style of code

Comments in files
  1. all comments in all files should be in english
  2. the header comment should have:
    a. file version: if this is a new file put version 1.0. if we work on a file and adding|removing code - increment version by 001.
    b. an explanation of the file functionality / algorythm, what type of objects it is working with, major interactions. 


IMPORTANT: explain how you understand the task and wait for my consent before writing the code. 

Переписку в чатах ведем на русском, но все комментарии и код пишем на английском.