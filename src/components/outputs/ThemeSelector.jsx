/*
[DEPRECATED]
This entire file is deprecated as Slidev Markdown is no longer used in favor of the HTML Slide Builder (v2).
The code below is commented out to prevent usage.

import React, { useState, useEffect } from 'react';
import { Button, Select, Space, Tooltip } from 'antd';
import { getSlidevThemes, rebuildSlide } from '../../services/slideService';
import { Palette, RefreshCw } from 'lucide-react';

export default function ThemeSelector({ outputId, currentTheme = 'default', markdown, onRebuildComplete }) {
  const [themes, setThemes]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [isRebuilding, setIsRebuilding]   = useState(false);

  useEffect(() => {
    getSlidevThemes()
      .then(setThemes)
      .finally(() => setIsLoading(false));
  }, []);

  const handleRebuild = async () => {
    if (!outputId || !markdown) return;
    setIsRebuilding(true);
    try {
      const result = await rebuildSlide(outputId, markdown, selectedTheme);
      if (onRebuildComplete) onRebuildComplete(result.share_url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRebuilding(false);
    }
  };

  if (themes.length === 0 && !isLoading) return null;

  const options = themes.map(t => ({ value: t.id, label: t.name }));

  return (
    <Space size={8} align="center">
      <Select
        value={selectedTheme}
        onChange={setSelectedTheme}
        options={options}
        loading={isLoading}
        disabled={isRebuilding}
        size="small"
        style={{ width: 140 }}
        suffixIcon={<Palette size={12} />}
        popupMatchSelectWidth={false}
        placeholder="Chọn theme..."
        styles={{
          popup: { root: { minWidth: 160 } },
        }}
      />

      {selectedTheme !== currentTheme && (
        <Tooltip title="Áp dụng theme mới">
          <Button
            type="primary"
            size="small"
            icon={<RefreshCw size={11} className={isRebuilding ? 'animate-spin' : ''} />}
            onClick={handleRebuild}
            disabled={isRebuilding}
            style={{ borderRadius: 9999, fontWeight: 500 }}
          >
            {isRebuilding ? 'Đang áp dụng...' : 'Áp dụng'}
          </Button>
        </Tooltip>
      )}
    </Space>
  );
}
*/
