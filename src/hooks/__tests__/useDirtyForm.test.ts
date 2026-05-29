import { useDirtyForm } from '@/hooks/useDirtyForm'

describe('useDirtyForm', () => {
  it('returns false when initial equals current', () => {
    expect(useDirtyForm({ name: 'Carlos', age: 30 }, { name: 'Carlos', age: 30 })).toBe(false)
  })

  it('returns true when a field changes', () => {
    expect(useDirtyForm({ name: 'Carlos' }, { name: 'Maria' })).toBe(true)
  })

  it('returns false for equal nested objects', () => {
    expect(useDirtyForm({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false)
  })

  it('returns true for changed nested objects', () => {
    expect(useDirtyForm({ a: { b: 1 } }, { a: { b: 2 } })).toBe(true)
  })

  it('returns false for equal empty strings', () => {
    expect(useDirtyForm({ name: '' }, { name: '' })).toBe(false)
  })

  it('returns true when field goes from empty to filled', () => {
    expect(useDirtyForm({ name: '' }, { name: 'Carlos' })).toBe(true)
  })
})
