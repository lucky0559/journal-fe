import { useSocial } from './socialStore';

beforeEach(() => useSocial.setState({ overrides: {}, reacts: {} }));

it('toggles a reaction on and off independently per kind', () => {
  const { toggleReact } = useSocial.getState();
  toggleReact('p1', 'hug');
  toggleReact('p1', 'same');
  expect(useSocial.getState().reacts.p1).toEqual({ hug: true, same: true });
  toggleReact('p1', 'hug');
  expect(useSocial.getState().reacts.p1).toEqual({ hug: false, same: true });
});

it('requests, cancels and keeps existing friendships', () => {
  const s = () => useSocial.getState();
  expect(s().stateOf('sol')).toBe('none');
  expect(s().toggleFriend('sol')).toBe('requested');
  expect(s().stateOf('sol')).toBe('requested');
  expect(s().toggleFriend('sol')).toBe('none');
  expect(s().toggleFriend('jun')).toBe('friends');
});
