import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, FileText, Presentation, HelpCircle, ExternalLink, Share2 } from 'lucide-react';
import { fetchOutputsByConversation } from '../../store/outputSlice';
import apiClient from '../../services/apiClient';

const typeConfig = {
  slide: {
    icon: Presentation,
    color: 'text-lumiere-brand',
    bg: 'bg-lumiere-brand/10',
    label: 'Bài thuyết trình',
  },
  quiz: {
    icon: HelpCircle,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    label: 'Bộ câu hỏi trắc nghiệm',
  },
  recap: {
    icon: FileText,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    label: 'Tóm tắt bài học',
  },
};

const OutputCard = ({ activeConversationId }) => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.outputs);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchOutputsByConversation(activeConversationId));
    }
  }, [dispatch, activeConversationId]);

  if (!activeConversationId) return null;

  if (status === 'loading') {
    return <div className="text-sm text-lumiere-text-tertiary p-4">Đang tải outputs...</div>;
  }

  if (!items || items.length === 0) {
    return null; // Return nothing if no outputs exist
  }

  const handleDownload = async (outputId) => {
    try {
      // In a real scenario, this gets the signed URL and redirects
      const response = await apiClient.get(`/api/outputs/${outputId}/download`);
      if (response.request?.responseURL) {
        window.open(response.request.responseURL, '_blank');
      }
    } catch (e) {
      console.error('Download error:', e);
      alert('Không thể tải file, vui lòng thử lại sau.');
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-lumiere-text-tertiary">
        Sản phẩm được tạo ra
      </h3>
      {items.map((output) => {
        const config = typeConfig[output.output_type] || typeConfig.recap;
        const Icon = config.icon;
        return (
          <div
            key={output.id}
            className="group relative flex items-start gap-4 rounded-xl border border-lumiere-border bg-lumiere-bg-secondary p-4 transition-all hover:border-lumiere-brand/50 hover:shadow-sm"
          >
            <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-lumiere-text-primary mb-1 truncate">
                {output.title || config.label}
              </h4>
              <p className="text-xs text-lumiere-text-secondary truncate">
                {new Date(output.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(output.share_url || output.type === 'slide') && output.share_url && (
                <>
                  <a
                    href={output.share_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-lumiere-text-tertiary hover:bg-lumiere-bg-primary hover:text-lumiere-brand transition-colors flex items-center gap-1"
                    title="Xem trình chiếu"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(output.share_url);
                        alert("Đã sao chép link chia sẻ!");
                      } catch (e) {
                        console.error('Failed to copy', e);
                      }
                    }}
                    className="p-2 rounded-lg text-lumiere-text-tertiary hover:bg-lumiere-bg-primary hover:text-lumiere-brand transition-colors flex items-center gap-1"
                    title="Sao chép link chia sẻ"
                  >
                    <Share2 size={18} />
                  </button>
                </>
              )}
              <button
                onClick={() => handleDownload(output.id)}
                className="p-2 rounded-lg text-lumiere-text-tertiary hover:bg-lumiere-bg-primary hover:text-lumiere-brand transition-colors"
                title="Tải xuống JSON/Markdown"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OutputCard;
