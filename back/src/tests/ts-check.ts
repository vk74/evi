// src/tests/ts-check.ts

interface User {
    id: number;
    name: string;
    role: 'admin' | 'user';  // union type
    lastLogin?: Date;  // optional property
  }
  
  // Generic function
  function processArray<T>(items: T[], callback: (item: T) => void): void {
    items.forEach(callback);
  }
  
  // Class with TypeScript features
  class TSChecker {
    private users: User[];
  
    constructor() {
      this.users = [
        { id: 1, name: 'John', role: 'admin' },
        { id: 2, name: 'Jane', role: 'user', lastLogin: new Date() }
      ];
    }
  
    // Method with type annotations
    public runChecks(): void {
      console.log('🟢 TypeScript Check Started');
  
      // Type inference check
      const numbers = [1, 2, 3];
      processArray(numbers, (num) => {
        console.log(`🟢 Number processing works: ${num + 1}`);
      });
  
      // Interface usage check
      processArray(this.users, (user) => {
        console.log(`🟢 User processing works: ${user.name} is ${user.role}`);
      });
  
      // Optional chaining check
      const lastLoginMessage = this.users[1]?.lastLogin?.toISOString() ?? 'never';
      console.log(`🟢 Optional chaining works: Last login was ${lastLoginMessage}`);
  
      // Type guard check
      const someValue: unknown = "Hello, TypeScript!";
      if (typeof someValue === 'string') {
        console.log(`🟢 Type guard works: ${someValue.toUpperCase()}`);
      }
  
      console.log('🟢 All TypeScript checks passed successfully!');
    }
  }
  
  // Execute checks
  const checker = new TSChecker();
  checker.runChecks();