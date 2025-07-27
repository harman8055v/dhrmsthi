// Basic utility function tests
describe('Basic Utility Functions', () => {
  // Test a simple utility function
  const formatName = (firstName: string, lastName: string): string => {
    if (!firstName && !lastName) return ''
    if (!firstName) return lastName
    if (!lastName) return firstName
    return `${firstName} ${lastName}`
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  describe('formatName', () => {
    it('should format full names correctly', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe')
    })

    it('should handle missing first name', () => {
      expect(formatName('', 'Doe')).toBe('Doe')
    })

    it('should handle missing last name', () => {
      expect(formatName('John', '')).toBe('John')
    })

    it('should handle both names missing', () => {
      expect(formatName('', '')).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(1, 3)).toBe(33)
      expect(calculatePercentage(2, 3)).toBe(67)
    })

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0)
    })
  })

  describe('Data Structures', () => {
    it('should work with arrays', () => {
      const numbers = [1, 2, 3, 4, 5]
      const doubled = numbers.map(n => n * 2)
      expect(doubled).toEqual([2, 4, 6, 8, 10])
    })

    it('should work with objects', () => {
      const user = { name: 'John', age: 30 }
      const updatedUser = { ...user, age: 31 }
      expect(updatedUser).toEqual({ name: 'John', age: 31 })
    })

    it('should filter arrays correctly', () => {
      const numbers = [1, 2, 3, 4, 5, 6]
      const evenNumbers = numbers.filter(n => n % 2 === 0)
      expect(evenNumbers).toEqual([2, 4, 6])
    })
  })

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const asyncFunction = async (value: string) => {
        return new Promise<string>(resolve => {
          setTimeout(() => resolve(`processed: ${value}`), 10)
        })
      }

      const result = await asyncFunction('test')
      expect(result).toBe('processed: test')
    })

    it('should handle promise rejections', async () => {
      const failingFunction = async () => {
        throw new Error('Something went wrong')
      }

      await expect(failingFunction()).rejects.toThrow('Something went wrong')
    })
  })

  describe('Mock Functions', () => {
    it('should work with jest mocks', () => {
      const mockCallback = jest.fn()
      
      // Call the mock function
      mockCallback('arg1', 'arg2')
      
      // Assert it was called correctly
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should mock return values', () => {
      const mockFunction = jest.fn()
      mockFunction.mockReturnValue('mocked value')
      
      const result = mockFunction()
      expect(result).toBe('mocked value')
    })

    it('should mock resolved promises', async () => {
      const mockAsyncFunction = jest.fn()
      mockAsyncFunction.mockResolvedValue('async result')
      
      const result = await mockAsyncFunction()
      expect(result).toBe('async result')
    })
  })
}) 