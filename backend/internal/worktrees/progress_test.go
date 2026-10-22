package worktrees

import (
	"testing"

	"github.com/t8nax/gentry/contract"
)

func TestPercent(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name     string
		finished bool
		passed   int
		totalMax int
		wantNil  bool
		want     int
	}{
		{name: "finished", finished: true, passed: 2, totalMax: 5, want: 100},
		{name: "finished_zero_total", finished: true, passed: 0, totalMax: 0, want: 100},
		{name: "half", finished: false, passed: 1, totalMax: 2, want: 50},
		{name: "round_up", finished: false, passed: 2, totalMax: 3, want: 67},
		{name: "zero_total_open", finished: false, passed: 0, totalMax: 0, wantNil: true},
		{name: "clamp_high", finished: false, passed: 5, totalMax: 2, want: 100},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := Percent(tc.finished, contract.TaskProgress{Passed: tc.passed, TotalMax: tc.totalMax})
			if tc.wantNil {
				if got != nil {
					t.Fatalf("want nil, got %v", *got)
				}
				return
			}
			if got == nil {
				t.Fatal("want value, got nil")
			}
			if *got != tc.want {
				t.Fatalf("got %d want %d", *got, tc.want)
			}
		})
	}
}
