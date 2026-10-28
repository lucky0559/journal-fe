import { fireEvent, render, screen } from '@testing-library/react-native';
import { Segmented } from './Segmented';

const options = [{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }] as const;

it('marks the chosen option and reports a tap on another one', () => {
  const onChange = jest.fn();
  render(<Segmented options={[...options]} value="friends" onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Friends' })).toBeSelected();
  expect(screen.getByRole('button', { name: 'Public' })).not.toBeSelected();
  fireEvent.press(screen.getByRole('button', { name: 'Public' }));
  expect(onChange).toHaveBeenCalledWith('public');
});

it('follows the value when it changes from outside', () => {
  const { rerender } = render(<Segmented options={[...options]} value="friends" onChange={() => {}} />);
  rerender(<Segmented options={[...options]} value="public" onChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Public' })).toBeSelected();
  expect(screen.getByRole('button', { name: 'Friends' })).not.toBeSelected();
});
