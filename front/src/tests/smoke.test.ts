/**
 * Smoke test для проверки работы системы тестирования
 */

describe('smoke test', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const str = 'hello world';
    expect(str.toUpperCase()).toBe('HELLO WORLD');
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
}); 