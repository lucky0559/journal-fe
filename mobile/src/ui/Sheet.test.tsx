import { fireEvent, render, screen } from '@testing-library/react-native';
import { KeyboardAvoidingView, Modal, Text } from 'react-native';
import { Sheet } from './Sheet';

// A sheet is mounted inside scrolling screens, so it must escape their layout (a Modal) or it only covers the scroll content and strands the user.
it('renders in a Modal that the hardware back button closes', () => {
  const onClose = jest.fn();
  render(<Sheet visible onClose={onClose} title="Add a friend"><Text>inside</Text></Sheet>);
  const modal = screen.UNSAFE_getByType(Modal);
  expect(modal.props.visible).toBe(true);
  modal.props.onRequestClose();
  expect(onClose).toHaveBeenCalled();
});

it('lifts the panel above the keyboard so a text field inside stays visible', () => {
  render(<Sheet visible onClose={jest.fn()}><Text>inside</Text></Sheet>);
  expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
});

it('renders children only while visible and closes from the scrim', () => {
  const onClose = jest.fn();
  const { rerender } = render(<Sheet visible={false} onClose={onClose}><Text>inside</Text></Sheet>);
  expect(screen.queryByText('inside')).toBeNull();
  rerender(<Sheet visible onClose={onClose} title="Who can read this page?"><Text>inside</Text></Sheet>);
  expect(screen.getByText('inside')).toBeTruthy();
  expect(screen.getByText('Who can read this page?')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalled();
});
