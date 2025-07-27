// Simple test to verify Jest setup
describe('Jest Setup Test', () => {
  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBeTruthy()
    expect(null).toBeFalsy()
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test')
    await expect(promise).resolves.toBe('test')
  })

  it('should mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
}) 