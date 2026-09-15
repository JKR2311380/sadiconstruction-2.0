# ADR 0008 — Default calendar is PH site week

One Project Calendar per Project (already locked). Default working week is **Mon–Sat / Sunday off**, with a **starter set of Philippine regular and special non-working holidays** as exceptions. Philippine construction commonly runs a six-day week with Sunday rest; a Mon–Fri office calendar would understate Duration in working days.

**Considered:** Mon–Fri default; empty holiday list; forcing a custom week at create-time.

**Consequences:** holiday seeds are data, not engine law — planners edit exceptions per Project. Multi-calendar remains out of scope.
