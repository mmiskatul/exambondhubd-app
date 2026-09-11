import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const toast = useToast();
  return (
    <TouchableOpacity onPress={() => toast.error('Could not save your changes.')}>
      <Text>Trigger</Text>
    </TouchableOpacity>
  );
}

describe('Toast', () => {
  it('shows a message after it is pushed', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    expect(screen.queryByText('Could not save your changes.')).toBeNull();

    fireEvent.press(screen.getByText('Trigger'));

    expect(screen.getByText('Could not save your changes.')).toBeTruthy();
  });

  it('routes a failed API response through fromResponse to an error toast', () => {
    function ResponseTrigger() {
      const toast = useToast();
      return (
        <TouchableOpacity
          onPress={() => toast.fromResponse({ success: false, message: 'Wrong password.' })}
        >
          <Text>Trigger</Text>
        </TouchableOpacity>
      );
    }

    render(
      <ToastProvider>
        <ResponseTrigger />
      </ToastProvider>,
    );

    fireEvent.press(screen.getByText('Trigger'));

    expect(screen.getByText('Wrong password.')).toBeTruthy();
  });
});
