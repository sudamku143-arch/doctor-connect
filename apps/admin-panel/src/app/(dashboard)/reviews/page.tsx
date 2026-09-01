import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listReviews } from "@/lib/api/reviews";
import { setReviewHiddenAction } from "./actions";
import styles from "../shared.module.css";

export default async function ReviewsPage() {
  const reviews = await listReviews();

  return (
    <>
      <header>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.subtitle}>{reviews.length} review(s)</p>
      </header>

      <Card>
        <Table
          headers={["Patient", "Doctor", "Rating", "Comment", "Status", ""]}
          isEmpty={reviews.length === 0}
          emptyMessage="No reviews yet."
        >
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.patient?.profile?.full_name ?? "—"}</td>
              <td>{review.doctor.full_name}</td>
              <td>{"★".repeat(review.rating)}</td>
              <td>{review.comment ?? "—"}</td>
              <td>
                <Badge label={review.is_hidden ? "Hidden" : "Visible"} tone={review.is_hidden ? "danger" : "success"} />
              </td>
              <td>
                <form action={setReviewHiddenAction.bind(null, review.id, !review.is_hidden)}>
                  <Button type="submit" variant="secondary">
                    {review.is_hidden ? "Restore" : "Hide"}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
