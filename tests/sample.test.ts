// tests/sample.test.ts
import { expect } from 'chai';

describe('Sample Test Suite', () => {
  it('should pass this test', () => {
    // Arrange
    const foo = 42;

    // Act
    const result = foo * 2;

    // Assert
    expect(result).to.equal(84);
  });
});
