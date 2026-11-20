# auto-pin

A Claude Code mod that pins every new session in the desktop app's Code-tab sidebar as soon as it starts, so your sessions are always under **Pinned**.

Desktop app only: in a terminal or VS Code session it does nothing.

After a session has been idle for 14 hours (configurable), auto-pin unpins it again; reopen it and it is pinned again. Only pins auto-pin made are removed: a session you pin yourself stays pinned until you unpin it.

## Settings

**Unpin after idle hours** (`idleHours`, default `14`): how long a session auto-pin pinned can sit idle before it is unpinned. `0` never unpins. Change it in the plugin's settings (the config menu), or when you install it.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install auto-pin --marketplace dhanushan75/auto-pin
```

From a shell:

```bash
claude plugin install auto-pin --marketplace dhanushan75/auto-pin
```

In the desktop app: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `dhanushan75/auto-pin`, then **Add plugin**.

## License

MIT
