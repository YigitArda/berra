export function initAuthEvents({
  navRightEl,
  onNavigate,
  onLogout,
  onOpenNotif,
  onOpenMessages,
  onOpenAuth,
  onSwitchAuth,
}) {
  navRightEl?.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-auth-action]');
    if (!trigger) return;

    const action = trigger.dataset.authAction;
    if (action === 'logout') onLogout();
    if (action === 'login') onOpenAuth();
    if (action === 'register') {
      onOpenAuth();
      onSwitchAuth('register');
    }
    if (action === 'messages') onOpenMessages();
    if (action === 'notifications') onOpenNotif();
    if (action === 'profile') onNavigate('/profile/' + trigger.dataset.user);
  });
}
