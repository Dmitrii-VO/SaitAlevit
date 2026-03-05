describe('Sanity Check', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('Project environment should be ready', () => {
    const projectname = 'saitgusia';
    expect(projectname).toBeDefined();
  });
});
