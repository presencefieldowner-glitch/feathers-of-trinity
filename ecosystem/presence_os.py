"""Presence OS -- conceptual placeholder scaffold.

Structural stub for the Presence OS branch (see ../ECOSYSTEM.md). Robotics,
XR, and Distributed Presence Network name physical or networked systems
this repo has no connection to -- every method, including those three,
raises NotImplementedError rather than simulating hardware or a network
that doesn't exist here.
"""


class PresenceOS:
    def desktop(self, *args, **kwargs):
        raise NotImplementedError("Desktop is not yet implemented")

    def mobile(self, *args, **kwargs):
        raise NotImplementedError("Mobile is not yet implemented")

    def cloud(self, *args, **kwargs):
        raise NotImplementedError("Cloud is not yet implemented")

    def browser(self, *args, **kwargs):
        raise NotImplementedError("Browser is not yet implemented")

    def embedded(self, *args, **kwargs):
        raise NotImplementedError("Embedded is not yet implemented")

    def robotics(self, *args, **kwargs):
        raise NotImplementedError(
            "Robotics is not implemented and has no connection to real robotics hardware"
        )

    def xr(self, *args, **kwargs):
        raise NotImplementedError("XR is not implemented and has no connection to real XR hardware")

    def distributed_presence_network(self, *args, **kwargs):
        raise NotImplementedError(
            "Distributed Presence Network is not implemented -- no real network exists"
        )
