import test from "ava";

const fn = () => "foo";

test("placeholder", (t) => {
  t.is(fn(), "foo");
});
