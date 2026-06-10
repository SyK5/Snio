export enum Action {
  READ = 1,
  CREATE = 2,
  UPDATE = 4,
  DELETE = 8,
  MANAGE = 16,
}

export const ALL_ACTIONS = Action.READ | Action.CREATE | Action.UPDATE | Action.DELETE | Action.MANAGE

const ORDERED: Action[] = [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE, Action.MANAGE]

export function hasAction(mask: number, action: Action): boolean {
  return (mask & action) === action
}

export function combine(...masks: number[]): number {
  return masks.reduce((acc, m) => acc | m, 0)
}

export function toActions(mask: number): Action[] {
  return ORDERED.filter(a => hasAction(mask, a))
}

export function fromActions(actions: Action[]): number {
  return combine(...actions)
}
