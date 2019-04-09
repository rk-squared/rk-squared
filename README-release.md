# RK Squared

RK Squared is a record keeper for Final Fantasy Record Keeper.

You can download it from the [Releases page](https://github.com/rk-squared/rk-squared/releases).

Current features:

- Dungeon tracker - track dungeon completion status and unclaimed reward
- Drop tracker - show what you'll get when you finish the current battle
- Record Materia tracker - to help you see which RMs you have unlocked but not yet acquired, what you have to to do get the best RMs, and which RMs are cluttering up your inventory and should be stashed
- Score tracker - view all your torment progress and magicite completion times on a single page to help you see where to focus next
- Game options
  - Always show timer

RK Squared runs as a proxy: It runs on your PC and Mac, and you configure your phone, tablet, or emulator to connect through it, so that it can track your game status.

Both Android and iOS versions of FFRK are supported.

Both the global and Japanese versions of FFRK are supported. However, a running copy of RK Squared only supports a single FFRK profile, so trying to use one copy to track both GL and JP will cause confusion.

This repository acts as the issue tracker and releases page for RK Squared.

## Security Note

FFRK for iOS encrypts its data, so, in order for RK Squared to work for iOS, it needs to be able to decrypt HTTPS traffic. As a general rule, you should be very cautious in granting software the ability to do this, and you should only do it with software you trust. (RK² is designed so that it can only decrypt FFRK traffic, which should help with any security concerns. In technical terms, it generates a private CA (certificate authority); then it uses that CA to create and save a certificate for ffrk.denagames.com, so that it can decrypt FFRK traffic; then it discards the CA key, so that it can't create certificates for any other sites.)

## Known Issues

RK Squared currently only supports a single FFRK profile. So, for example, if you play both GL and JP, you'll need to find a way to run two copies of RK Squared (for example, use two different laptops, or two different PC accounts, or manually copy RK Squared's config.json depending on which profile you're playing).
