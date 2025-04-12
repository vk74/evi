  
The project is using typescript (with some parts still remain in javascript) and a layerd architecture with single responsibility concept - separate files for controllers, services, cache and other types. 
Don't delete nor optimize code without my consent.  
Don't use classes in the files, use functions and methods instead. 
Add logging for major functions and events. the logging function is centralized. see example below. 

function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupMembersService] ${message}`, meta || '');
}


