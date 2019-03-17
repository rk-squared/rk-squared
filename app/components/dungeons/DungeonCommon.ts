export const rewards = (isAnonymous?: boolean) =>
  (isAnonymous ? 'available' : 'unclaimed') + ' rewards';
export const rewardsTitle = (isAnonymous?: boolean) =>
  (isAnonymous ? 'Available' : 'Unclaimed') + ' Rewards';
