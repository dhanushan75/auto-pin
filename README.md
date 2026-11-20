# auto-pin

A Claude Code mod that pins every new session in the desktop app's Code-tab sidebar as soon as it starts, so your sessions are always under **Pinned**.

Desktop app only: in a terminal or VS Code session it does nothing.

After a session has been idle for 14 hours, auto-pin unpins it again; reopen it and it is pinned again. Only pins auto-pin made are removed: a session you pin yourself stays pinned until you unpin it.

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
