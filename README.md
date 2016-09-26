# sushi
A javascript client for the sashimi interactive fiction engine.

Sushi is the Javascript client for the game "Alice and the Galactic Traveller." 

In theory, this code could be used with any [Sashimi IF](https://github.com/ionous/sashimi) game. But, there are a few reasons this doesn't work in practice: 
	
1. The code contains a few hard-coded references to character and events which are specific to Alice's story files. ( There are probably around 20 such customizations. ) 
1. The html contains menus ( including the credits screen! ) which are specific to the game.
1. The tools used to generate map and item files are not yet publicly available.
1. There are build scripts ( including bower dependencies, etc. ) which are not included.

It's still -- I hope -- an interesting reference ( and an interesting use-case for the AngularJs version of [hsm-statechart](https://github.com/ionous/hsm-statechart). ) It may become more generally useful -- less dependent on Alice -- with time.
