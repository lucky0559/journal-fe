import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Sheet } from './Sheet';

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
