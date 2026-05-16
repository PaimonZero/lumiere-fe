/**
 * Trang xem Presentation — dùng SlideViewer (HTML deck trong iframe)
 */
import { useParams } from 'react-router-dom';
import SlideViewer from '../../components/editor/SlideViewer.jsx';

export default function PresentationEditorPage() {
  const { id } = useParams();
  return <SlideViewer presentationId={id} />;
}
