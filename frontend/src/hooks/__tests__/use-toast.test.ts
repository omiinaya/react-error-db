import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useToast, toast } from '../use-toast';

// Mock the toast function
vi.mock('../use-toast', () => ({
  useToast: vi.fn(),
  toast: vi.fn(),
}));

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call toast with success variant', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Success',
        description: 'Operation completed successfully',
        variant: 'default',
      });
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Operation completed successfully',
      variant: 'default',
    });
  });

  it('should call toast with default variant', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Info',
        description: 'This is information',
      });
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Info',
      description: 'This is information',
      variant: 'default',
    });
  });

  it('should call toast with destructive variant', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
    });
  });

  it('should call toast with custom duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Custom',
        description: 'With custom duration',
        duration: 5000,
      });
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Custom',
      description: 'With custom duration',
      variant: 'default',
      duration: 5000,
    });
  });

  it('should provide dismiss function', () => {
    const mockDismiss = vi.fn();
    (toast as any).mockReturnValue({ id: '123', dismiss: mockDismiss });

    const { result } = renderHook(() => useToast());
    
    let toastResult: any;
    act(() => {
      toastResult = result.current.toast({
        title: 'Test',
        description: 'Test toast',
      });
    });

    act(() => {
      result.current.dismiss(toastResult.id);
    });

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should handle toast dismissal', () => {
    const mockDismiss = vi.fn();
    (toast as any).mockReturnValue({ id: '123', dismiss: mockDismiss });

    const { result } = renderHook(() => useToast());
    
    let toastResult: any;
    act(() => {
      toastResult = result.current.toast({
        title: 'Test',
        description: 'Test toast',
      });
    });

    act(() => {
      result.current.dismiss(toastResult.id);
    });

    expect(mockDismiss).toHaveBeenCalled();
  });
});